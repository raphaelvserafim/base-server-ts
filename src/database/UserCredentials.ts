import { DataTypes, Model, Sequelize } from 'sequelize';
import { DB } from "@app/database";
import { IUserCredentials } from '@app/interfaces';

class UserCredentials extends Model<IUserCredentials> {

  public static initialize(sequelize: Sequelize) {
    UserCredentials.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: false
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          }
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false
        }
      },
      {
        sequelize,
        tableName: 'user_credentials',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

UserCredentials.initialize(DB.getInstance());

export { UserCredentials };